'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudioIndex() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/studio/spatial');
    }, [router]);

    return (
        <div style={{ padding: 40, color: '#64748B' }}>
            Redirecting to Spatial Insights...
        </div>
    );
}
