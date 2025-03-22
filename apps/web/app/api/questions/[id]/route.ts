// app/api/questions/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getQuestionFromIPFS } from '@/lib/pinata';

export async function GET(request, { params }) {
  try {
    console.log('Question details GET handler started');
    const { id } = await Promise.resolve(params);
    
    if (!id) {
      console.log('Validation failed: Missing question ID');
      return NextResponse.json(
        { error: 'Question ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Finding question with ID:', id);
    
    // Find the question by ID
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        asker: {
          select: {
            walletAddress: true,
            askTokens: true,
          }
        },
        answers: {
          include: {
            responder: {
              select: {
                walletAddress: true
              }
            },
            votes: {
              include: {
                voter: {
                  select: {
                    walletAddress: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!question) {
      console.log('Question not found with ID:', id);
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    console.log('Question found:', question.id);
    
    // Get the question content from IPFS
    try {
      console.log('Retrieving question content from IPFS, CID:', question.pinataCid);
      const questionContent = await getQuestionFromIPFS(question.pinataCid);
      
      // Get answers content from IPFS if they exist
      const answersWithContent = await Promise.all(
        question.answers.map(async (answer) => {
          try {
            const answerContent = await getQuestionFromIPFS(answer.pinataCid);
            
            // Count upvotes (for now, all votes are considered upvotes)
            const votesCount = answer.votes.length;
            
            return {
              id: answer.id,
              content: answerContent,
              responderWalletAddress: answer.responder.walletAddress,
              createdAt: answer.createdAt,
              votesCount: votesCount,
              voters: answer.votes.map(vote => vote.voter.walletAddress)
            };
          } catch (ipfsError) {
            console.error('Error retrieving answer content:', ipfsError);
            return {
              id: answer.id,
              content: 'Error retrieving content',
              responderWalletAddress: answer.responder.walletAddress,
              createdAt: answer.createdAt,
              votesCount: answer.votes.length,
              error: ipfsError.message
            };
          }
        })
      );
      
      // Format the response
      const response = {
        id: question.id,
        subject: question.subject,
        content: questionContent,
        reward: question.reward,
        createdAt: question.createdAt,
        rewardAt: question.rewardAt,
        pinataCid: question.pinataCid,
        askerWalletAddress: question.asker.walletAddress,
        rewarded: question.rewarded,
        answers: answersWithContent
      };
      
      console.log('Successfully retrieved question details');
      return NextResponse.json(response, { status: 200 });
      
    } catch (ipfsError) {
      console.error('Error retrieving question content from IPFS:', ipfsError);
      return NextResponse.json(
        { 
          error: 'Failed to retrieve question content from IPFS', 
          message: ipfsError.message,
          questionMetadata: { 
            id: question.id,
            subject: question.subject,
            reward: question.reward,
            createdAt: question.createdAt,
            rewardAt: question.rewardAt,
            askerWalletAddress: question.asker.walletAddress,
            rewarded: question.rewarded
          }
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error retrieving question details:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve question details', message: error.message },
      { status: 500 }
    );
  }
}

// Optional: Add ability to update question - mark as rewarded
export async function PUT(request, { params }) {
  try {
    console.log('Question update PUT handler started');
    
    const body = await request.json();
    const { walletAddress, rewarded } = body;
    
    if (!id || !walletAddress) {
      console.log('Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Question ID and wallet address are required' },
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
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Find the question
    const question = await prisma.question.findUnique({
      where: { id },
      select: { askerId: true }
    });
    
    if (!question) {
      console.log('Question not found with ID:', id);
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Check if the user is the asker
    if (question.askerId !== user.id) {
      console.log('Unauthorized: User is not the question asker');
      return NextResponse.json(
        { error: 'Only the question asker can update this question' },
        { status: 403 }
      );
    }
    
    // Update the question - only support updating rewarded status
    const updateData = {};
    if (rewarded !== undefined) updateData.rewarded = rewarded;
    
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: updateData
    });
    
    console.log('Question updated successfully:', updatedQuestion.id);
    
    return NextResponse.json({
      success: true,
      questionId: updatedQuestion.id,
      message: 'Question updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question', message: error.message },
      { status: 500 }
    );
  }
}