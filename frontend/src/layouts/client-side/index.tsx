import { ReactNode } from "react";
import LuxuryNavbar from "../../components/home/LuxuryNavbar";

interface Props {
    isNavbarOn: boolean;
    children: ReactNode;
}

export function ClientSideLayout({ isNavbarOn, children }: Props) {
    return (
        <div className="flex-1 w-full h-full">
            {isNavbarOn && <LuxuryNavbar transparent={false} />}

            <main>
                {children}
            </main>
        </div>
    );
}