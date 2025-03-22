// app/api/questions/route.js
import { NextResponse } from 'next/server';
import { uploadQuestionToIPFS } from '@/lib/pinata';
import prisma from '@/lib/prisma';
import { getQuestionFromIPFS } from '@/lib/pinata';

export async function POST(request) {
  try {
    console.log('Question POST handler started');
    
    // Parse request body
    const body = await request.json();
    const { walletAddress, content, subject, reward } = body;
    console.log('Request data:', { walletAddress, subject, contentLength: content?.length, reward });
    
    if (!content || !subject || !walletAddress) {
      console.log('Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Question content, subject, and wallet address are required' },
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
    
    // Check if user has enough tokens
    const rewardAmount = parseFloat(reward) || 0.1;
    console.log('Token balance check:', { userTokens: user.askTokens, requiredTokens: rewardAmount });
    
    if (user.askTokens < rewardAmount) {
      console.log('Insufficient token balance');
      return NextResponse.json(
        { error: `Not enough ASK tokens. You have ${user.askTokens}, but need ${rewardAmount}.` },
        { status: 400 }
      );
    }
    
    let pinataCid;
    try {
      // Upload question to Pinata - updated to match the new function signature
      console.log('Uploading content to Pinata');
      pinataCid = await uploadQuestionToIPFS(content, {
        subject,
        asker: walletAddress
      });
      
      console.log('Pinata upload successful, CID:', pinataCid);
      
      if (!pinataCid) {
        console.error('Pinata upload failed: No CID returned');
        return NextResponse.json(
          { error: 'Failed to upload question content: No CID returned from Pinata' },
          { status: 500 }
        );
      }
    } catch (pinataError) {
      console.error('Pinata upload failed:', pinataError);
      return NextResponse.json(
        { error: 'Failed to upload question content', message: pinataError.message },
        { status: 500 }
      );
    }
    
    // Create question in database and deduct tokens from user
    console.log('Starting database transaction');
    const question = await prisma.$transaction(async (tx) => {
      // Deduct tokens from user
      console.log('Deducting tokens from user:', user.id);
      await tx.user.update({
        where: { id: user.id },
        data: { askTokens: { decrement: rewardAmount } },
      });
      
      // Create question
      console.log('Creating question record');
      return tx.question.create({
        data: {
          content,
          subject,
          reward: rewardAmount,
          askerId: user.id,
          pinataCid, // Store the CID in the database
          rewardAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      });
    });
    
    console.log('Question created successfully:', question.id);
    
    return NextResponse.json({
      success: true,
      questionId: question.id,
      pinataCid,
      message: 'Question posted successfully'
    });
  } catch (error) {
    console.error('Error posting question:', error);
    return NextResponse.json(
      { error: 'Failed to post question', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    let questions;

    if (walletAddress) {
      // Fetch questions by a specific user
      const user = await prisma.user.findUnique({ where: { walletAddress } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      questions = await prisma.question.findMany({
        where: { askerId: user.id },
        select: { id: true, pinataCid: true, subject: true, reward: true, createdAt: true}
      });
    } else {
      // Fetch all questions
      questions = await prisma.question.findMany({
        select: { id: true, pinataCid: true, subject: true, reward: true, createdAt: true }
      });
    }

    // Retrieve actual content from Pinata for each question
    const questionsWithContent = await Promise.all(
      questions.map(async (q) => ({
        id: q.id,
        category: q.subject,
        reward: q.reward,
        createdAt: q.createdAt,
        title : await getQuestionFromIPFS(q.pinataCid),
        // Fetch from Pinata
      }))
    );

    return NextResponse.json(questionsWithContent, { status: 200 });
  } catch (error) {
    console.error('Error retrieving questions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve questions', message: error.message },
      { status: 500 }
    );
  }
}