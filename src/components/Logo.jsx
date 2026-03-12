import { Link } from 'react-router-dom';
import logoSvg from '../assets/logo.svg';

function Logo({ size = 'md', linkTo = '/' }) {
  const sizeClass = size === 'lg' ? 'h-12' : size === 'sm' ? 'h-6' : 'h-8';

  return (
    <Link to={linkTo}>
      <img src={logoSvg} alt="소개퐝" className={sizeClass} />
    </Link>
  );
}

export default Logo;
