/**
 * Seed script — insère les 3 articles de blog par défaut en base via l'API backend.
 * Usage: node seed-blogs.js
 */

const http = require("http");

const API_BASE = "http://localhost:6002/api/v1";

const BLOGS = [
  {
    title: "L'Art du Lit en Lin Lavé : Le Chic Décontracté",
    slug: "art-du-lit-lin-lave",
    description:
      "Découvrez pourquoi le lin lavé est devenu l'indispensable des chambres contemporaines raffinées et comment l'adopter chez vous.",
    content:
      "Le lin lavé est bien plus qu'une tendance : c'est un art de vivre. Sa texture douce et légèrement froissée évoque une élégance naturelle, loin de la rigidité des matières synthétiques. Adopté par les plus grands décorateurs d'intérieur, il transforme chaque chambre en refuge de sérénité. Comment l'intégrer ? Misez sur des teintes neutres comme le blanc cassé, le sable ou le gris perle. Associez-le à un mobilier en bois naturel et à des accessoires en osier pour une atmosphère cohérente et chaleureuse.",
    image: "/blog/blog_bedding.jpg",
    author: "Linge de lit",
  },
  {
    title: "L'art de Dresser une Table d'Exception",
    slug: "art-dresser-table-exception",
    description:
      "De la délicatesse de la porcelaine aux détails dorés des couverts, apprenez à composer une table poétique qui raconte une histoire.",
    content:
      "Recevoir est un art qui se prépare avec soin. Une table bien dressée est le reflet de votre personnalité et de votre goût. Commencez par choisir une nappe en lin ou en coton de qualité, puis disposez vos assiettes avec précision. Les couverts en argent ou avec des finitions dorées ajoutent une touche de raffinement. N'oubliez pas les verres à pied en cristal qui captent la lumière et les petits arrangements floraux qui donnent vie à l'ensemble. Chaque détail compte pour créer une atmosphère inoubliable.",
    image: "/blog/blog_tableware.jpg",
    author: "Art de la table",
  },
  {
    title: "Créer un Refuge de Sérénité Chez Soi",
    slug: "creer-refuge-serenite-chez-soi",
    description:
      "Épuration des lignes, jeux de textures et teintes douces : nos conseils essentiels pour transformer votre intérieur en havre de paix.",
    content:
      "Notre maison est notre sanctuaire. Pour en faire un véritable refuge, commencez par désencombrer votre espace. Chaque objet doit avoir une raison d'être, une utilité ou une beauté. Optez pour une palette de couleurs apaisantes : beige, blanc, taupe, sauge. Intégrez des matières naturelles — bois, pierre, lin, coton — qui apportent chaleur et authenticité. La lumière naturelle est votre meilleure alliée : favorisez des rideaux légers qui laissent entrer la lumière tout en préservant votre intimité.",
    image: "/blog/blog_livingroom.jpg",
    author: "Design d'intérieur",
  },
];

function postBlog(blog) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(blog);
    const options = {
      hostname: "localhost",
      port: 6002,
      path: "/api/v1/blogs",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log(`✅ Blog créé : "${blog.title}"`);
          resolve(JSON.parse(data));
        } else {
          console.error(`❌ Erreur pour "${blog.title}": ${res.statusCode} — ${data}`);
          resolve(null);
        }
      });
    });

    req.on("error", (err) => {
      console.error(`❌ Requête échouée pour "${blog.title}":`, err.message);
      resolve(null);
    });

    req.write(body);
    req.end();
  });
}

async function seed() {
  console.log("🌱 Début du seeding des blogs...\n");
  for (const blog of BLOGS) {
    await postBlog(blog);
  }
  console.log("\n✅ Seeding terminé ! Rafraîchissez votre dashboard admin.");
}

seed();
