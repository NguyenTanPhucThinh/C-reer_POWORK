/**
 * ClamAV Client — kết nối tới clamd qua TCP (clamscan package)
 * Dùng để quét file vừa upload lên MinIO trước khi cho phép Employer xem
 */
import clamscan from 'clamscan'
import net from 'node:net'
import { config } from './index.js'

let clamscanInstance = null

// Lazy init — chỉ tạo kết nối khi job thực sự cần quét (tránh treo lúc server start nếu ClamAV chưa sẵn sàng)
export const getClamScan = async () => {
  if (clamscanInstance) return clamscanInstance

  clamscanInstance = await new clamscan().init({
    removeInfected: false, // KHÔNG tự xóa — để Service quyết định xử lý (reject submission)
    quarantineInfected: false,
    scanLog: null,
    debugMode: process.env.NODE_ENV === 'development',
    clamdscan: {
      host: config.clamav.host,
      port: config.clamav.port,
      timeout: 60000,
      localFallback: false,
    },
  })

  return clamscanInstance
}

export const checkClamavReady = async () => {
  try {
    await new Promise((resolve, reject) => {
      const socket = net.createConnection({
        host: config.clamav.host,
        port: config.clamav.port,
      })
      let response = ''
      let settled = false

      const finish = (error) => {
        if (settled) return
        settled = true
        socket.destroy()
        error ? reject(error) : resolve()
      }

      socket.setEncoding('utf8')
      socket.setTimeout(3000)
      socket.once('connect', () => socket.write('PING\n'))
      socket.on('data', (chunk) => {
        response += chunk
        if (response.trim() === 'PONG') finish()
      })
      socket.once('timeout', () => finish(new Error('ClamAV PING timed out')))
      socket.once('error', finish)
      socket.once('end', () => {
        if (!settled) finish(new Error(`Unexpected ClamAV response: ${response.trim()}`))
      })
    })

    return {
      ready: true,
      error: null,
    }
  } catch (error) {
    return {
      ready: false,
      error: error.message,
    }
  }
}
