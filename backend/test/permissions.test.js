import test from 'node:test';
import assert from 'node:assert/strict';

import {
  permissionsCatalog,
  roleLabels,
  getRolePermissions,
  hasPermission,
  getMatrixView
} from '../src/lib/permissions.js';

test('super_admin inherits all catalog permissions', () => {
  const permissions = getRolePermissions('super_admin');
  assert.equal(permissions.length, permissionsCatalog.length);
  assert.deepEqual(permissions, permissionsCatalog.map((item) => item.key));
});

test('member has baseline chat permissions but not admin access', () => {
  assert.equal(hasPermission('member', 'rooms.read'), true);
  assert.equal(hasPermission('member', 'messages.write'), true);
  assert.equal(hasPermission('member', 'admin.access'), false);
});

test('unknown role resolves to empty permissions set', () => {
  assert.deepEqual(getRolePermissions('ghost_role'), []);
  assert.equal(hasPermission('ghost_role', 'rooms.read'), false);
});

test('matrix view returns labeled role summary', () => {
  const matrix = getMatrixView();
  const admin = matrix.find((item) => item.role === 'admin');
  assert.ok(admin);
  assert.equal(admin.label, roleLabels.admin);
  assert.ok(admin.permissionsCount > 0);
  assert.ok(admin.permissions.includes('admin.access'));
});
