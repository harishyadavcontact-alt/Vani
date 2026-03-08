async function main() {
  console.log('Demo seed ready. Configure DATABASE_URL for persistent production storage.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
