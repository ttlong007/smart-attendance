import prisma from './lib/prisma.js'

async function main() {
  try {
    console.log('Testing prisma.attendance.create with wifiBssid...')
    // We won't actually execute, just check if it compiles and if we can call it
    // Or we can try a dry run / findUnique
    const model = (prisma as any).attendance;
    console.log('Attendance model found:', !!model)
    
    // We can try to validate the fields
    const fields = Object.keys((prisma as any)._runtimeDataModel.models.Attendance.fields)
    console.log('Fields in Attendance model:', fields)
    
    if (fields.includes('wifiBssid')) {
      console.log('SUCCESS: wifiBssid found in runtime model!')
    } else {
      console.log('FAILURE: wifiBssid NOT found in runtime model!')
    }
  } catch (e) {
    console.error('Error during verification:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
