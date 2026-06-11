import { Role, Permission } from '../models';

export const authorize =
    (slug: string, action: string) =>
        async (req: any, res: any, next: any) => {
            if (!req.user || !req.user.roleId) {
                return res.status(401).json({ message: 'Unauthorized: No user provided' });
            }
            const permission = await Permission.findOne({
                where: { slug },
                include: { model: Role, where: { id: req.user.roleId } }
            });
            if (!permission) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            if (permission.fullAccess || permission.hasOwnProperty(action)) next();



            return res.status(403).json({ message: 'Forbidden' });
        };
