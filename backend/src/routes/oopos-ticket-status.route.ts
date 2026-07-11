import { Router, Request, Response } from 'express';
import { adminAuth } from '../middleware/adminAuth';
import { OoposTicketStatus } from '../models/oopos_ticket_status.model';

const router = Router();

// GET /oopos-ticket-statuses?date=YYYY-MM-DD
// Returns { [entete]: status } map for all tickets of a given date
router.get('/', adminAuth, async (req: Request, res: Response) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'date requis' });
  const rows = await OoposTicketStatus.findAll({ where: { ticketDate: String(date) } });
  const map: Record<string, string> = {};
  rows.forEach((r) => { map[String(r.entete)] = r.status; });
  return res.json(map);
});

// PATCH /oopos-ticket-statuses/:entete
// Body: { status, ticketDate }
router.patch('/:entete', adminAuth, async (req: Request, res: Response) => {
  const entete = String(req.params.entete);
  const { status, ticketDate } = req.body;
  const valid = ['pending', 'preconfirmed', 'confirmed', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ message: 'Statut invalide' });
  if (!ticketDate) return res.status(400).json({ message: 'ticketDate requis' });

  const [row] = await OoposTicketStatus.upsert({ entete, status, ticketDate });
  return res.json(row);
});

export default router;
