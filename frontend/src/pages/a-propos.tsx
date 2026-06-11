import { ClientSideLayout } from "@/layouts/client-side";

export default function AProposPage() {
    return (
        <ClientSideLayout isNavbarOn={true}>
            <section style={{ background: "#fff", minHeight: "100vh" }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "96px 40px 88px" }}>
                    <p
                        style={{
                            fontSize: "9px",
                            letterSpacing: "5px",
                            textTransform: "uppercase",
                            color: "#999",
                            margin: "0 0 14px",
                        }}
                    >
                        A propos
                    </p>

                    <h1
                        style={{
                            fontSize: "clamp(30px, 4vw, 52px)",
                            fontWeight: 200,
                            letterSpacing: "-0.5px",
                            color: "#0e0d0c",
                            margin: "0 0 28px",
                            lineHeight: 1.1,
                        }}
                    >
                        Notre histoire
                    </h1>

                    <div
                        className="grid grid-cols-1 md:grid-[1.05fr_0.95fr]"
                        style={{ display: "grid", gap: "28px", alignItems: "stretch" }}
                    >
                        <div
                            style={{
                                border: "1px solid #ece8e2",
                                padding: "32px",
                                background: "#fcfbf9",
                                color: "#6b6b6b",
                                fontSize: "14px",
                                lineHeight: 1.9,
                            }}
                        >
                            <p style={{ margin: "0 0 14px" }}>
                                Chez nous, chaque détail est pensé avec exigence. Nous croyons que le confort véritable naît d’un choix rigoureux des matières et d’un engagement constant envers la qualité.
                            </p>
                            <p style={{ margin: "0 0 14px" }}>
                                Nous sélectionnons des fibres d’exception telles que le coton Pima, le lin lavé et la percale de coton égyptien. Reconnues pour leur douceur, leur résistance et leur élégance naturelle, elles offrent une expérience de confort durable au quotidien.
                            </p>
                            <p style={{ margin: "0 0 14px" }}>
                                Notre démarche va au-delà de l’esthétique. Tous nos textiles respectent les exigences de la certification OEKO-TEX® Standard 100, garantissant l’absence de substances nocives, pour votre bien-être et celui de votre famille.
                            </p>
                            <p style={{ margin: "0 0 14px" }}>
                                Nous privilégions une approche responsable : concevoir des produits durables, pensés pour traverser le temps sans compromis sur le style ou la qualité.
                            </p>
                            <p style={{ margin: 0 }}>
                                Notre mission est simple : offrir des textiles raffinés, sûrs et durables, qui transforment chaque instant en une expérience de confort authentique.
                            </p>
                        </div>
                        <div style={{ border: "1px solid #ece8e2", overflow: "hidden", background: "#f6f2ec" }}>
                            <img
                                src="/assets/imgs/furniture/about/about-image1.jpg"
                                alt="A propos"
                                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: "100%" }}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </ClientSideLayout>
    );
}
