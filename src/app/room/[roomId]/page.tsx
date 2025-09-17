import RoomClient from "@/components/RoomClient";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  // Await params before accessing its properties
  const { roomId } = await params;

  return <RoomClient roomId={roomId} />;
}