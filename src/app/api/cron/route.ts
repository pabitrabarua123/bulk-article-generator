
export async function GET() {
    console.log("✅ Cron job triggered!");
    
    return new Response("Cron executed successfully!", { status: 200 });
  }