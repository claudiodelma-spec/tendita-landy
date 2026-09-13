import { prisma } from "../config/prisma.js";
import { PERMISSIONS, ROLE_PERMISSIONS } from "./permissionCatalog.js";

export { PERMISSIONS, ROLE_PERMISSIONS, permissionsForRoles } from "./permissionCatalog.js";

/** Seeds the Permission catalog and RolePermission mapping (idempotent). */
export async function seedPermissions() {
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { label: perm.label },
      create: perm,
    });
  }

  for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName as any } });
    if (!role) continue;
    for (const key of keys) {
      const permission = await prisma.permission.findUnique({ where: { key } });
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
}
