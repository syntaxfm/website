export default function formatTime(time) {
    // Hours, minutes and seconds
    var hrs = Math.floor((~~(time / 3600)));
    var mins = Math.floor((~~((time % 3600) / 60)));
    var secs = Math.floor((time % 60));

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}
