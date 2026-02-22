import { CornerRightUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from './button';

const AuthenticateButton = () => {
  return (
    <div
      id="gooey-btn"
      className="group relative flex items-center"
      style={{ filter: 'url(#gooey-filter)' }}
    >
      <Button
        size={'icon'}
        className="absolute right-0 z-0 flex h-8 -translate-x-10 cursor-pointer items-center justify-center rounded-full px-2.5 py-2 text-xs font-normal transition-all duration-300 group-hover:-translate-x-20"
      >
        <Link href={'/auth/register'}>
          <CornerRightUp className="size-3" />
        </Link>
      </Button>
      <Button className="z-10 flex h-8 cursor-pointer items-center rounded-lg px-6 py-2 text-xs font-normal transition-all duration-300">
        <Link href={'/auth/login'}>Login</Link>
      </Button>
    </div>
  );
};

export default AuthenticateButton;
