//make api call
let apiData;

(async () =>{
    try {
        const res = await fetch("https://mentorpick.com/api/courseV2/contest/submission/my?problem=&verdictString=ACCEPTED&contestSlug=bz-bvrith-y22-phase-1-week-1-practice&language=&limit=100&page=1&user=jangili&courseId=65fadb136edf77d59a861c05&contestId=5384ef75-30ae-4101-bfd8-7a7645869000");
        
        if(!res.ok){
            throw new Error ('Failed to get api');
        }
        const data = await res.json();
        apiData = data;

        console.log(apiData);
        
        if(apiData){
            apiData.data.sort((a,b)=>{
                const timeA = Date.parse(a.created_at);
                const timeB = Date.parse(b.created_at);
                return timeA - timeB;
            })
        }
        console.log(apiData);

    }
    catch (error) {
        console.error("Error", error);
        throw error;
    }
    

})();

