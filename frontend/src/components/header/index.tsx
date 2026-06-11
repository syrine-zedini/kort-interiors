import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export default function Header() {
   const images = [
      "/public/119e110e-15d2-449d-969a-19e563903d77.jpg",
      "/public/9eb2d6b2-fc22-4024-adb6-e6ff6bf24e21.jpg",
      "/public/5beaa5cb-6fd7-4143-91d1-f9277b7277f6.jpg",
   ];

   return (
      <>
         <section className="banner-4 bg-white p-relative furniture-banner-area fix bg-image pb-100">
            <div className="container">
               <div className="row g-5 align-items-end">

                  <div className="col-xxl-6 col-lg-6">
                     <div className="banner-content-4 furniture__content">
                        <h2 className="banner-title-4">
                           Kort Interiors<br />Votre spécialiste du linge
                        </h2>
                        <p>KORT Interiors propose du linge de maison alliant confort, élégance et sens du détail. Inspirées par l’art de vivre contemporain, ses collections utilisent des matières authentiques et des couleurs chaleureuses pour créer des atmosphères de bien-être. Chaque produit sublime le quotidien et transforme la maison en refuge, alliant simplicité, raffinement et inspiration durable.</p>
                        <div className="banner-btn-wrapper furniture__btn-group">
                           <a className="solid-btn" href="product-details.html">Acheter maintenant<span>
                              <i className="fa-regular fa-angle-right"></i></span></a>
                           <a className="border__btn-banner" href="product-details.html">Voir les détails<span>
                              <i className="fa-regular fa-angle-right"></i></span></a>
                        </div>
                     </div>
                  </div>

                  <div className="col-xxl-6 col-lg-6">
                     <div className="image-wrapper">
                        <Swiper
                           modules={[Pagination, Autoplay]}
                           pagination={{ clickable: true }}
                           autoplay={{ delay: 4000 }}
                           loop
                           className="banner-thumb-4"
                        >
                           {images.map((src, idx) => (
                              <SwiperSlide key={idx}>
                                 <div className="image-container">
                                    <img
                                       src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${src}`}
                                       alt={`slide-${idx}`}
                                    />
                                 </div>
                              </SwiperSlide>
                           ))}
                        </Swiper>
                     </div>
                  </div>

               </div>
            </div >
         </section >

         <style jsx global>{`
            /* ===== Image Styling ===== */
            .image-container {
               margin-top:30px;
               position: relative;
               border-radius: 24px;
               overflow: hidden;
               box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
            }

            .image-container img {
               width: 100%;
               height: 500px;
               object-fit: cover;
               transition: transform 0.6s ease;
            }

            .image-container:hover img {
               transform: scale(1.05);
            }

            /* ===== Decorative Circle ===== */
            .image-container::after {
               content: "";
               position: absolute;
               width: 120px;
               height: 120px;
               border-radius: 50%;
               background: #edd9d9;
               bottom: -40px;
               right: -40px;
               z-index: 2;
               opacity: 0.6;
            }

            /* ===== Pagination Styling ===== */
            .banner-thumb-4 .swiper-pagination-bullet {
               background: #d8bcbc;
               opacity: 1;
               width: 10px;
               height: 10px;
            }

            .banner-thumb-4 .swiper-pagination-bullet-active {
               background: #8c6f5a;
               width: 26px;
               border-radius: 10px;
            }
         `}</style>
      </>
   );
}