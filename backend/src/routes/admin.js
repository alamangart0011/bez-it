import { Router } from 'express';
import { requireAdminAccess, requirePermission } from '../middleware/permissions.js';
import { adminService } from '../services/admin.service.js';
import { sendError } from '../lib/http-error.js';
import { validateAdminOperatorAction, validateAdminRoomCreate, validateAdminUserUpdate, validateAnnouncementPayload, validateBrandingPayload, validateDepartmentCreate, validateInvitationCreate } from '../validators/admin.validators.js';

export const adminRouter = Router();

adminRouter.get('/overview', requireAdminAccess, async (req, res) => {
  try {
    res.json(await adminService.overview());
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.get('/audit', requirePermission('audit.read'), async (req, res) => {
  try {
    res.json(await adminService.audit());
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.get('/incidents', requirePermission('audit.read'), async (req, res) => {
  try {
    res.json(await adminService.incidents());
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.post('/incidents/:incidentId/ack', requirePermission('audit.read'), async (req, res) => {
  try {
    res.json(await adminService.acknowledgeIncident(req.user, req.params.incidentId));
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.post('/incidents/:incidentId/resolve', requirePermission('audit.read'), async (req, res) => {
  try {
    res.json(await adminService.resolveIncident(req.user, req.params.incidentId));
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.get('/users', requirePermission('users.manage'), async (req, res) => {
  try {
    res.json(await adminService.users());
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.patch('/users/:userId', requirePermission('users.manage'), async (req, res) => {
  try {
    const payload = validateAdminUserUpdate(req.body);
    res.json(await adminService.updateUser(req.user, req.params.userId, payload));
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.post('/users/:userId/revoke-sessions', requirePermission('sessions.manage'), async (req, res) => {
  try {
    res.json(await adminService.revokeUserSessions(req.user, req.params.userId));
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.get('/roles-matrix', requirePermission('roles.manage'), async (req, res) => {
  try {
    res.json(await adminService.rolesMatrix());
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.get('/sessions', requirePermission('sessions.manage'), async (req, res) => {
  try {
    res.json(await adminService.sessions());
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.get('/rooms', requirePermission('rooms.create'), async (req, res) => {
  try {
    res.json(await adminService.rooms());
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.post('/rooms', requirePermission('rooms.create'), async (req, res) => {
  try {
    const payload = validateAdminRoomCreate(req.body);
    res.status(201).json(await adminService.createRoom(req.user, payload));
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.post('/rooms/:roomId/archive', requirePermission('rooms.archive'), async (req, res) => {
  try {
    res.json(await adminService.archiveRoom(req.user, req.params.roomId));
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.post('/rooms/:roomId/operator-action', requirePermission('rooms.archive'), async (req, res) => {
  try {
    const payload = validateAdminOperatorAction(req.body);
    res.json(await adminService.operatorAction(req.user, req.params.roomId, payload));
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.get('/departments', requirePermission('users.manage'), async (req, res) => {
  try {
    res.json(await adminService.departments());
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.post('/departments', requirePermission('users.manage'), async (req, res) => {
  try {
    const payload = validateDepartmentCreate(req.body);
    res.status(201).json(await adminService.createDepartment(req.user, payload));
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.get('/invitations', requirePermission('users.manage'), async (req, res) => {
  try {
    res.json(await adminService.invitations());
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.post('/invitations', requirePermission('users.manage'), async (req, res) => {
  try {
    const payload = validateInvitationCreate(req.body);
    res.status(201).json(await adminService.createInvitation(req.user, payload));
  } catch (error) {
    return sendError(res, error);
  }
});


adminRouter.get('/announcement', requirePermission('system.manage'), async (req, res) => {
  try {
    res.json(await adminService.announcement());
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.put('/announcement', requirePermission('system.manage'), async (req, res) => {
  try {
    const payload = validateAnnouncementPayload(req.body);
    const updated = await adminService.updateAnnouncement(req.user, payload);
    req.app.get('io')?.emit('system:announcement', updated);
    res.json(updated);
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.delete('/announcement', requirePermission('system.manage'), async (req, res) => {
  try {
    const cleared = await adminService.clearAnnouncement(req.user);
    req.app.get('io')?.emit('system:announcement', cleared);
    res.json(cleared);
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.get('/system', requirePermission('system.manage'), async (req, res) => {
  try {
    res.json(await adminService.system());
  } catch (error) {
    return sendError(res, error);
  }
});

adminRouter.put('/system', requirePermission('system.manage'), async (req, res) => {
  try {
    const payload = validateBrandingPayload(req.body);
    res.json(await adminService.updateSystem(req.user, payload));
  } catch (error) {
    return sendError(res, error);
  }
});
