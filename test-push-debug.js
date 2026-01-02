const userIds = ["fe6c9ee9-8973-40a7-a063-a28f20785f31"];
const url = "https://xihgmsmdcpufeennodlg.supabase.co/functions/v1/send-push-notification";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaGdtc21kY3B1ZmVlbm5vZGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzI5OTAsImV4cCI6MjA4MTY0ODk5MH0.BpDOOANvcTZG_gboCQKerVzWsbUiq_DACBzdBE3vJm8";

console.log('Sending request to', url);

fetch(url, {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ userIds })
})
    .then(async res => {
        console.log('Status code:', res.status);
        const text = await res.text();
        console.log('RESPONSE_BODY_START');
        console.log(text);
        console.log('RESPONSE_BODY_END');
    })
    .catch(err => {
        console.error('FETCH ERROR:', err);
    });
