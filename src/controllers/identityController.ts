import { Request, Response } from 'express';
import { identifyContactService } from '../services/identityService';
import { validateIdentifyRequest } from '../utils/validators';

export async function identifyContact(req: Request, res: Response) {
  try {
    // Validate request
    const validation = validateIdentifyRequest(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.issues
      });
    }

    const { email, phoneNumber } = validation.data;
    const emailVal = email ?? null;
    const phoneNumberVal = phoneNumber ?? null;

    // Call service
    const result = await identifyContactService(emailVal, phoneNumberVal);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error in identifyContact:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}