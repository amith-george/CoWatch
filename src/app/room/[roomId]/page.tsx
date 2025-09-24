// src/app/room/[roomId]/page.tsx

import RoomClient from '@/components/RoomClient';
import { RoomProvider } from '@/contexts/RoomContext';
import { notFound } from 'next/navigation';

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  if (!roomId) {
    notFound();
  }

  return (
    <RoomProvider roomId={roomId}>
      <RoomClient />
    </RoomProvider>
  );
}