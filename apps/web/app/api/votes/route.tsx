import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(request){
    try{
        console.log("Upvoting Answer started")
        const body = await request.json();
        const {answerId,walletAddress,isUpvote} = body;
        
        console.log("Request data:",{answerId,walletAddress,isUpvote})
        if(!answerId || !walletAddress || isUpvote === undefined){
            console.log("Validation failed: Missing required fields")
            return NextResponse.json(
                {error : "Answer ID, wallet address and isUpvote are required"},
                {status:400}
            )
        }
        console.log("Finding user with wallet address:",walletAddress)
        const user = await prisma.user.findUnique({
            where : {walletAddress}
        })

        if(!user){
            console.log("User not found with wallet address:",walletAddress)
            return NextResponse.json(
                {error : "User not found. Please connect your wallet first."},
                {status:404}
            )
        }
        console.log("User found:",user.id)
        console.log("Finding answer with ID:",answerId)
        const answer = await prisma.answer.findUnique({
            where : {id:answerId}
        })
        if(!answer){
            console.log("Answer not found with ID:",answerId)
            return NextResponse.json(
                {error : "Answer not found with ID:" + answerId},
                {status:404}
            )
        }
        console.log("Answer found:",answer.id)
        console.log("Checking if user has already voted for the answer")
        const vote = await prisma.vote.findFirst({
            where : {
                answerId : answer.id,
                voterId : user.id
            }
        })
        console.log("Vote found:",vote)
        if(vote){
            console.log("User has already voted for the answer")
            return NextResponse.json(
                {error : "User has already voted for the answer"},
                {status:400}
            )
        }
        console.log("Checking if user is trying to upvote his own answer")
        if(answer.responderId === user.id){
            console.log("User is trying to upvote his own answer")
            return NextResponse.json(
                {error : "User cannot upvote his own answer"},
                {status:400}
            )
        }
        console.log("Checking if user has enough tokens")
        await prisma.vote.create({
            data : {
                answerId : answer.id,
                voterId : user.id
            }
        })
        console.log("Vote created successfully")
        return NextResponse.json(
            {message : "Vote created successfully"},
            {status:200}
        );
    }catch(err){
        console.log("Error in voting",err)
        return NextResponse.json(
            {error : "Failed to vote for the answer: " , message : err.message},
            {status:500}
        )
    }
}