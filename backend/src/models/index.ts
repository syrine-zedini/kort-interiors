import { User } from './user.model';
import { Role } from './role.model';
import { Permission } from './permission.model';
import { RolePermission } from './rolePermission.model';
import { ProductCategory } from './product_categories.model';
import { Product } from './product.model';
import { ProductVariant } from './product_variant';
import { ProductItem } from './product_item.model';
import { Promotion } from './promotion.model';
import { Color } from './color.model';
import { CartItem } from './cart_item.model';
import { Commande } from './commande.model';
import { CommandeItem } from './commande_item.model';
import { Blog } from './blog.model';
import { Style } from './style.model';
import { HeroSlide } from './heroSlide.model';
import { OoposProductPhoto } from './oopos_product_photos.model';
import { OoposTicketStatus } from './oopos_ticket_status.model';
import { PromoModalSettings } from './promoModal.model';
import { VideoSectionSettings } from './videoSection.model';

// Associations Role <-> Permission (many-to-many)

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  as: 'permissions',
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  as: 'roles',
});

// Associations User -> Role (many-to-one)
User.belongsTo(Role, {
  foreignKey: 'roleId',
  as: 'role',
});

Role.hasMany(User, {
  foreignKey: 'roleId',
  as: 'users',
});

// Self-referential many-to-many association
ProductCategory.belongsToMany(ProductCategory, {
  as: 'parents',       // Name to access parent categories
  through: 'product_category_hierarchy', // Join table
  foreignKey: 'childId',
  otherKey: 'parentId',
});

ProductCategory.belongsToMany(ProductCategory, {
  as: 'children',      // Name to access subcategories
  through: 'product_category_hierarchy', // Join table
  foreignKey: 'parentId',
  otherKey: 'childId',
});

// Product ↔ Category
Product.belongsTo(ProductCategory, { foreignKey: 'categoryId', as: 'category' });
ProductCategory.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
// Variant ↔ Product
Product.hasMany(ProductVariant, { foreignKey: 'productId', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Variant ↔ Color
ProductVariant.belongsTo(Color, { foreignKey: 'color', targetKey: 'id', as: 'colorData' });

// Variant ↔ Style
ProductVariant.belongsTo(Style, { foreignKey: 'style', targetKey: 'id', as: 'styleData' });

// Item ↔ Product (items within a product group, e.g. Taie, Housse, Drap)
Product.hasMany(ProductItem, { foreignKey: 'productId', as: 'items' });
ProductItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Promotion ↔ Product/Category
Promotion.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(Promotion, { foreignKey: 'productId', as: 'promotions' });

Promotion.belongsTo(ProductCategory, { foreignKey: 'categoryId', as: 'category' });
Promotion.belongsTo(ProductCategory, { foreignKey: 'subCategoryId', as: 'subCategory' });

// Cart ↔ User
User.hasMany(CartItem, { foreignKey: 'userId', as: 'cartItems' });
CartItem.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Cart ↔ Product
CartItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(CartItem, { foreignKey: 'productId', as: 'cartItems' });

// Commande ↔ User
User.hasMany(Commande, { foreignKey: 'userId', as: 'commandes' });
Commande.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Commande ↔ CommandeItem
Commande.hasMany(CommandeItem, { foreignKey: 'commandeId', as: 'items' });
CommandeItem.belongsTo(Commande, { foreignKey: 'commandeId', as: 'commande' });

// CommandeItem ↔ Product
CommandeItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(CommandeItem, { foreignKey: 'productId', as: 'commandeItems' });

export { User, Role, Permission, RolePermission, ProductCategory, Product, ProductVariant, ProductItem, Promotion, Color, CartItem, Commande, CommandeItem, Blog, Style, HeroSlide, OoposProductPhoto, OoposTicketStatus, PromoModalSettings, VideoSectionSettings };

