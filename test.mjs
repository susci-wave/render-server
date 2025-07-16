
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

console.log(dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss'))
console.log(dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD hh:mm:ss'))
console.log(dayjs().add(8,'hours').tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss'))