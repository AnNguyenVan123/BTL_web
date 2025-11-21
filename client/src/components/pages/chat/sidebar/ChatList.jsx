import UserChat from "./User";

export default function ChatList() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <UserChat />
        <UserChat />
      </div>
    </>
  );
}
