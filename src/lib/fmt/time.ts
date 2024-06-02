/**
 * 计算距离当前过去了多久
 * - 刚刚
 * - 1分钟
 * - 1小时
 * - 当天：18:09
 * - 昨天：昨天 18:09
 * - 一周：星期四
 * - 今年：6月19日
 * - 其它：2019年6月9日
 */
export function formatShortTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const day = 24 * 60 * 60 * 1000;
  const hour = 60 * 60 * 1000;
  const minute = 60 * 1000;
  if (diff < minute) {
    return "刚刚";
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时`;
  } else {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const time = `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
    if (now.getFullYear() === year) {
      if (
        now.getMonth() === date.getMonth() &&
        now.getDate() === date.getDate()
      ) {
        return time;
      } 
      if (now.getDate() - date.getDate() === 1) {
        return `昨天 ${time}`;
      }
      if (now.getDay() - date.getDay() < 7) {
        const days = ["日", "一", "二", "三", "四", "五", "六"];
        return `星期${days[date.getDay()]}`;
      }
      return `${month}月${day}日`;
    }
    return `${year}年${month}月${day}日`;
  }
}

/**
 *
 * - 当天：18:09
 * - 昨天：昨天 18:09
 * - 一周：星期四 18:09
 * - 今年：6月19日 18:09
 * - 其它：2019年6月9日 18:09
 */
export function formatTime(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const now = new Date();
  const time = `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
  if (now.getFullYear() === year) {
    if (
      now.getMonth() === date.getMonth() &&
      now.getDate() === date.getDate()
    ) {
      return time;
    }
    if (now.getDate() - date.getDate() === 1) {
      return `昨天 ${time}`;
    }
    if (now.getDay() - date.getDay() < 7) {
      const days = ["日", "一", "二", "三", "四", "五", "六"];
      return `星期${days[date.getDay()]} ${time}`;
    }
    return `${month}月${day}日 ${time}`;
  }
  return `${year}年${month}月${day}日 ${time}`;
}
