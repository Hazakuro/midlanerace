import './globals.css';
export const metadata={title:'MidlaneArena race'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}<style dangerouslySetInnerHTML={{__html:`
.sponsorBanner{border-color:#b88a42!important;background:linear-gradient(135deg,#1d1406,#0a1119 52%,#211706)!important;box-shadow:inset 0 0 22px #d09b3a1f,0 0 18px #d09b3a22,0 0 0 1px #6d522744!important}
.sponsorBanner span{color:#c7a75b!important}
.sponsorBanner strong{color:#f0d38a!important;text-shadow:0 0 12px #d8ad4d66,0 0 22px #d8ad4d33!important}
`}} /></body></html>}
