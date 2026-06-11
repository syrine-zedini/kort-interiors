import { Role, Permission, RolePermission } from '../models';

export const seedRolesPermissions = async () => {
  // --- Créer les rôles s'ils n'existent pas ---
  const [superAdmin] = await Role.findOrCreate({
    where: { name: 'SuperAdmin' },
    defaults: { description: 'Contrôle total sur tous les modules' },
  });

  const [user] = await Role.findOrCreate({
    where: { name: 'user' },
    defaults: { description: 'Client' },
  });

  // --- Créer les permissions s'ils n'existent pas ---
  const permissionsData = [
    { slug: 'users' },
    { slug: 'products' },
    { slug: 'categories' }
  ];

  const permissions = await Promise.all(
    permissionsData.map(async (p) => {
      const [perm] = await Permission.findOrCreate({
        where: { slug: p.slug },
        defaults: { ...p, fullAccess: false },
      });
      return perm;
    })
  );

  const getPermission = (slug: string) => permissions.find((p) => p.slug === slug);

  // --- Assign permissions without duplicates ---
  const assignPermissions = async (role: Role, slugs: string[], defaultOptions: any = {}) => {
    for (const slug of slugs) {
      const perm = getPermission(slug);
      if (!perm) continue;

      // Check if the RolePermission already exists
      const exists = await RolePermission.findOne({
        where: { roleId: role.id, permissionId: perm.id },
      });

      if (!exists) {
        await RolePermission.create({
          roleId: role.id,
          permissionId: perm.id,
          ...defaultOptions,
        });
      }
    }
  };

  // SuperAdmin → full access sur tout
  await assignPermissions(superAdmin, permissionsData.map((p) => p.slug), { fullAccess: true });

  // User
  await assignPermissions(user, ['products', 'categories'], { canRead: true });

  console.log('Seed roles & permissions terminé !');
};