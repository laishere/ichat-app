import { useEffect, useState } from "react";
import { MemberView } from "./member";
import { Member } from "./types";

export function LayoutGrid({ members }: { members: Member[] }) {
  return (
    <div className="flex flex-wrap h-full overflow-auto">
      {members.map((member) => (
        <div
          className="w-full h-1/2 xl:w-1/4 md:w-1/3 sm:w-1/2"
          key={member.userId}
        >
          <MemberView member={member} big={true} />
        </div>
      ))}
    </div>
  );
}

export function LayoutMainA({ members }: { members: Member[] }) {
  const [mainIndex, setMainIndex] = useState(0);
  const secondIndex = (mainIndex + 1) % members.length;

  useEffect(() => {
    if (mainIndex >= members.length) {
      setMainIndex(members.length - 1);
    }
  }, [members, mainIndex]);

  function swapMain() {
    setMainIndex(secondIndex);
  }

  if (members.length == 0) {
    return null;
  }

  return (
    <div className="h-full overflow-hidden relative">
      <MemberView
        member={members[Math.min(mainIndex, members.length - 1)]}
        bordered={false}
      />
      {secondIndex < members.length && (
        <div
          className="absolute w-56 aspect-[16/9] top-10 right-4"
          onDoubleClick={swapMain}
        >
          <MemberView member={members[secondIndex]} big={false} />
        </div>
      )}
    </div>
  );
}

export function LayoutMainB({ members }: { members: Member[] }) {
  const [mainIndex, setMainIndex] = useState(0);

  const others = members.filter((_, index) => index != mainIndex);

  function swapMain(userId: number) {
    const index = members.findIndex((member) => member.userId == userId);
    if (index != -1) {
      setMainIndex(index);
    }
  }

  if (members.length == 0) {
    return null;
  }

  return (
    <div className="h-full overflow-hidden flex">
      <MemberView
        member={members[Math.min(mainIndex, members.length - 1)]}
        bordered={false}
      />
      <div className="w-64 overflow-auto bg-white p-1 space-y-1">
        {others.map((member) => (
          <div
            className="w-full aspect-[16/9]"
            key={member.userId}
            onDoubleClick={() => swapMain(member.userId)}
          >
            <MemberView member={member} bordered={false} big={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
