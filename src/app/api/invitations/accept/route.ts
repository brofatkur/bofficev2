import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { acceptInvitation, getInvitationByHash, readableError } from '@/lib/data-store';

export const runtime='nodejs';
export async function POST(req:NextRequest){try{const {token,password}=await req.json();if(!token||!password||password.length<8)return NextResponse.json({success:false,error:'Tautan dan password minimal 8 karakter wajib diisi.'},{status:400});const hash=createHash('sha256').update(token).digest('hex');const invitation=await getInvitationByHash(hash);if(!invitation||invitation.acceptedAt||new Date(invitation.expiresAt)<new Date())return NextResponse.json({success:false,error:'Tautan undangan tidak valid atau sudah kedaluwarsa.'},{status:410});return NextResponse.json({success:true,data:await acceptInvitation(invitation,password)});}catch(error){return NextResponse.json({success:false,error:readableError(error)},{status:500})}}
