// app/api/answers/route.js
import { NextResponse } from 'next/server';
import { uploadQuestionToIPFS, getQuestionFromIPFS } from '@/lib/pinata';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    console.log('Answer POST handler started');
    
    // Parse request body
    const body = await request.json();
    const { walletAddress, content, questionId } = body;
    console.log('Request data:', { walletAddress, questionId, contentLength: content?.length });
    
    if (!content || !questionId || !walletAddress) {
      console.log('Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Answer content, question ID, and wallet address are required' },
        { status: 400 }
      );
    }
    
    // Find the user by wallet address
    console.log('Finding user with wallet address:', walletAddress);
    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });
    
    if (!user) {
      console.log('User not found with wallet address:', walletAddress);
      return NextResponse.json(
        { error: 'User not found. Please connect your wallet first.' },
        { status: 404 }
      );
    }
    
    console.log('User found:', user.id);
    
    // Verify question exists
    console.log('Verifying question exists:', questionId);
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });
    
    if (!question) {
      console.log('Question not found:', questionId);
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    let pinataCid;
    try {
      // Upload answer to Pinata
      console.log('Uploading content to Pinata');
      pinataCid = await uploadQuestionToIPFS(content, {
        questionId,
        responder: walletAddress
      });
      
      console.log('Pinata upload successful, CID:', pinataCid);
      
      if (!pinataCid) {
        console.error('Pinata upload failed: No CID returned');
        return NextResponse.json(
          { error: 'Failed to upload answer content: No CID returned from Pinata' },
          { status: 500 }
        );
      }
    } catch (pinataError) {
      console.error('Pinata upload failed:', pinataError);
      return NextResponse.json(
        { error: 'Failed to upload answer content', message: pinataError.message },
        { status: 500 }
      );
    }
    
    // Create answer in database
    console.log('Creating answer record');
    const answer = await prisma.answer.create({
      data: {
        pinataCid,
        responderId: user.id,
        questionId: question.id
      }
    });
    
    console.log('Answer created successfully:', answer.id);
    
    return NextResponse.json({
      success: true,
      answerId: answer.id,
      pinataCid,
      message: 'Answer submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');

    if (!questionId) {
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }

    // Verify question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Fetch answers for this question
    const answers = await prisma.answer.findMany({
      where: { questionId: questionId },  // Fixed: changed 'id' to 'questionId'
      include: {
        responder: {
          select: {
            walletAddress: true
          }
        },
        votes: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If no answers found, return an empty array with a 200 status
    if (!answers || answers.length === 0) {
      console.log(`No answers found for question ID: ${questionId}`);
      return NextResponse.json([], { status: 200 });
    }

    // Retrieve actual content from Pinata for each answer
    const answersWithContent = await Promise.all(
      answers.map(async (answer) => {
        try {
          const content = await getQuestionFromIPFS(answer.pinataCid);
          return {
            id: answer.id,
            content: content,
            responderWallet: answer.responder.walletAddress,
            createdAt: answer.createdAt,
            voteCount: answer.votes.length
          };
        } catch (error) {
          console.error(`Error retrieving content for answer ID ${answer.id}:`, error);
          return {
            id: answer.id,
            content: "Error retrieving content",
            responderWallet: answer.responder.walletAddress,
            createdAt: answer.createdAt,
            voteCount: answer.votes.length,
            error: true
          };
        }
      })
    );

    return NextResponse.json(answersWithContent, { status: 200 });
  } catch (error) {
    console.error('Error retrieving answers:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve answers', message: error.message },
      { status: 500 }
    );
  }
}