import { ChildNodeProps } from '@/lib/interfaces/interface';
import { FC } from 'react';

const layout: FC<ChildNodeProps> = ({ children }) => {
  return <>{children}</>;
};

export default layout;
