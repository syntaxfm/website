export default function formatTime(time) {
    // Hours, minutes and seconds
    var hrs = (~~(time / 3600)).toFixed(0);
    var mins = (~~((time % 3600) / 60)).toFixed(0);
    var secs = (time % 60).toFixed(0);

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}
