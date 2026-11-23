'use client';

import { useEffect, useRef, type ComponentProps } from 'react';
import type { AppTarget } from '@/config/site';
import { appUrl, readRef } from '@/lib/appUrl';

type Props = { target: AppTarget; placement: string } & Omit<ComponentProps<'a'>, 'href' | 'target'>;

// A link into the app. The page is built with its UTM tags in place, so it works with no script;
// in the browser it also picks up the visitor's referral code from the address bar.
export function AppLink({ target, placement, ...rest }: Props) {
  const link = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const ref = readRef(location.search);
    if (ref) link.current!.href = appUrl(target, { ref, placement });
  }, [target, placement]);
  return <a ref={link} href={appUrl(target, { placement })} {...rest} />;
}
