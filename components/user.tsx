import { auth } from "../auth";

export default async function UserAvatar() {
  const session = await auth();

  if (!session?.user) return null;
  console.log(session.user);

  return <div>{session.user.name}</div>;
}
