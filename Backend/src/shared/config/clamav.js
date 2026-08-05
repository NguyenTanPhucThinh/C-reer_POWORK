/**
 * ClamAV Client — kết nối tới clamd qua TCP (clamscan package)
 * Dùng để quét file vừa upload lên MinIO trước khi cho phép Employer xem
 */
import clamscan from 'clamscan'
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
    await getClamScan()

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
