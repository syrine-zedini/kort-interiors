'use client';

import Image from "next/image";
import { useCategories } from "../../hooks/useCategories";
import Loader from "./loader";
import Link from "next/link";
import { useCart } from "@/hooks/useCart";

export default function Navbar() {
    const { categories, loading } = useCategories();
    const { items } = useCart();
    
    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    if (loading)
        return (<Loader />)
    return (
        <>
            <header>
                <div className="header">

                    <div className="header-layout-4 header-bottom">
                        <div id="header-sticky" className="header-4">
                            <div className="mega-menu-wrapper">
                                <div className="header-main-4">
                                    <div className="header-left">
                                        <div className="header-logo">
                                            <a href="index.html">
                                                <div className="w-[80px] h-[80px] overflow-hidden rounded-full">
                                                    <Image
                                                        alt="logo"
                                                        src="/assets/logo.jpg"
                                                        width={80}
                                                        height={80}
                                                        className="object-cover w-full h-full"
                                                    />
                                                </div>

                                            </a>
                                        </div>
                                        <div className="mean__menu-wrapper furniture__menu d-none d-lg-block">
                                            <div className="main-menu">
                                                <nav id="mobile-menu">
                                                    <ul>
                                                        {categories && categories.map((c) => (
                                                            <li className="has-dropdown" key={c.id}>
                                                                <Link href={`/products/${c.slug ?? c.id}`}>
                                                                    {c.name}
                                                                </Link>

                                                                <ul className="submenu">
                                                                    {c.children && c.children.map((child) => (
                                                                        <li key={child.id}>
                                                                            <Link href={`/products/${child.slug ?? child.id}`}>
                                                                                {child.name}
                                                                            </Link>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </li>
                                                        ))}


                                                        <li className="has-dropdown">
                                                            <Link href="/blog">Blog</Link>
                                                        </li>
                                                        <li>
                                                            <a href="contact.html">Contact</a>
                                                        </li>
                                                    </ul>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="header-right d-inline-flex align-items-center justify-content-end">

                                        <div className="header-action d-flex align-items-center ml-30">
                                            <div className="header-action-item">
                                                <a href="wishlist.html" className="header-action-btn">
                                                    <svg width="23" height="21" viewBox="0 0 23 21" fill="none"
                                                        xmlns="http://www.w3.org/2000/svg">
                                                        <path
                                                            d="M21.2743 2.33413C20.6448 1.60193 19.8543 1.01306 18.9596 0.609951C18.0649 0.206838 17.0883 -0.0004864 16.1002 0.00291444C14.4096 -0.0462975 12.7637 0.529279 11.5011 1.61122C10.2385 0.529279 8.59252 -0.0462975 6.90191 0.00291444C5.91383 -0.0004864 4.93727 0.206838 4.04257 0.609951C3.14788 1.01306 2.35732 1.60193 1.72785 2.33413C0.632101 3.61193 -0.514239 5.92547 0.245772 9.69587C1.4588 15.7168 10.5548 20.6578 10.9388 20.8601C11.11 20.9518 11.3028 21 11.4988 21C11.6948 21 11.8875 20.9518 12.0587 20.8601C12.445 20.6534 21.541 15.7124 22.7518 9.69587C23.5164 5.92547 22.37 3.61193 21.2743 2.33413ZM20.4993 9.27583C19.6416 13.5326 13.4074 17.492 11.5011 18.6173C8.81516 17.0587 3.28927 13.1457 2.50856 9.27583C1.91872 6.35103 2.72587 4.65208 3.50773 3.74126C3.9212 3.26166 4.43995 2.87596 5.02678 2.61185C5.6136 2.34774 6.25396 2.21175 6.90191 2.21365C7.59396 2.16375 8.28765 2.2871 8.91534 2.57168C9.54304 2.85626 10.0833 3.29235 10.4835 3.83743C10.5822 4.012 10.7278 4.15794 10.9051 4.26003C11.0824 4.36212 11.2849 4.41662 11.4916 4.41787C11.6983 4.41911 11.9015 4.36704 12.0801 4.26709C12.2587 4.16714 12.4062 4.02296 12.5071 3.84959C12.9065 3.30026 13.448 2.86048 14.0781 2.57361C14.7081 2.28674 15.4051 2.16267 16.1002 2.21365C16.7495 2.21061 17.3915 2.34604 17.9798 2.6102C18.5681 2.87435 19.0881 3.26065 19.5025 3.74126C20.282 4.65208 21.0892 6.35103 20.4993 9.27583Z"
                                                            fill="black" />
                                                    </svg>
                                                    <span className="header-action-badge bg-furniture">3</span>
                                                </a>
                                            </div>
                                            <div className="header-action-item">
                                                <Link href="/cart" className="header-action-btn cartmini-open-btn">
                                                    <svg width="21" height="23" viewBox="0 0 21 23" fill="none"
                                                        xmlns="http://www.w3.org/2000/svg">
                                                        <path
                                                            d="M14.0625 10.6C14.0625 12.5883 12.4676 14.2 10.5 14.2C8.53243 14.2 6.9375 12.5883 6.9375 10.6M1 5.8H20M1 5.8V13C1 20.6402 2.33946 22 10.5 22C18.6605 22 20 20.6402 20 13V5.8M1 5.8L2.71856 2.32668C3.12087 1.5136 3.94324 1 4.84283 1H16.1571C17.0568 1 17.8791 1.5136 18.2814 2.32668L20 5.8"
                                                            stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <span className="header-action-badge bg-furniture">{cartItemCount}</span>
                                                </Link>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
}