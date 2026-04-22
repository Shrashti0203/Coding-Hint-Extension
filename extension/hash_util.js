window.generateHash = async function generateHash(text) {
    try{
        const encoder = new TextEncoder();
        const data= encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256',data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }catch(error){
        console.error("Hash generation failed:",error);
        return text.slice(0, 50);
    }
    
}