import Avatar from "@/components/Avatar";
import IconGroup from "@/icons/group";
import { formatShortTime } from "@/lib/fmt/time";
import { Contact } from "@/lib/model/contact";
import { useAppSelector } from "@/lib/store";
import { selectContactInfo, setCurrentContactById } from "@/lib/store/contacts";
import { CSSProperties } from "react";
import { useDispatch } from "react-redux";

interface ChatSessionProps {
  item: Contact;
  active: boolean;
}

export default function ContactItem(props: ChatSessionProps) {
  const { item, active } = props;
  const dispatch = useDispatch();
  const contactInfo = useAppSelector(selectContactInfo(item));

  function _selectContact() {
    dispatch(setCurrentContactById(item.contactId));
  }

  const bgStyles: CSSProperties = active
    ? {
        background: "linear-gradient(271deg, #95A3F9 0%, #2F48F9 100%)",
        boxShadow: "0px 3px 6px 0px rgba(0, 0, 0, 0.1608)",
      }
    : {
        background:
          "linear-gradient(90deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%)",
      };

  const groupIcon = item.groupId ? (
    <div className="absolute bottom-0 right-0 text-lg">
      <IconGroup />
    </div>
  ) : null;

  return (
    <div
      style={bgStyles}
      className="flex h-16 items-center px-4 overflow-hidden rounded-[0.4rem] mx-[1.2rem] relative cursor-pointer"
      onClick={_selectContact}
    >
      <div className="relative">
        <Avatar
          src={contactInfo.avatar}
          className="size-[2.5rem] bg-black bg-opacity-10"
          alt=""
        />
        {groupIcon}
      </div>
      <div className="flex-1 mx-3">
        <div
          className={
            "text-[0.85rem] font-medium line-clamp-1 overflow-hidden " +
            (active ? "text-white" : "text-gray-100")
          }
        >
          {contactInfo.name}
        </div>
        <div
          className={
            "text-xs h-[1rem] line-clamp-1 overflow-hidden " +
            (active ? "text-gray-100" : "text-gray-100")
          }
        >
          {item.lastMessageContent || ""}
        </div>
      </div>
      <div className="h-[2rem]">
        <div
          className={"text-xs " + (active ? "text-gray-100" : "text-gray-100")}
        >
          {item.lastMessageTime
            ? formatShortTime(new Date(item.lastMessageTime))
            : ""}
        </div>
      </div>
    </div>
  );
}
