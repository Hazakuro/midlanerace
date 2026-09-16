import Link from 'next/link';
export default function NotFound(){return <main className="wrap"><div className="card"><div className="eyebrow">404</div><h1>Страница не найдена</h1><p className="muted">Проверьте адрес или вернитесь на главную.</p><Link className="btn primary" href="/">На главную</Link></div></main>}
