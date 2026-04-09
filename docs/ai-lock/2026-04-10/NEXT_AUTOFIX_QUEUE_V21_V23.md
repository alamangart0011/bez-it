# Next autofix queue

## V21
- add room-scoped alias routes for delete/pin if any old UI path remains
- hide or disable phone OTP tabs until backend parity is final
- keep room-based model canonical in active UI
- reduce unauthorized voice-state polling noise

## V22
- split monolithic frontend/src/App.jsx into room shell + panels + overlays
- clean left sidebar / members panel / room header
- remove dead or duplicate UI actions

## V23
- harden voice overlay
- presence + speaking states cleanup
- device / self-state UX cleanup

## Blocking residue to remove later
- chats/chat_members/calls legacy model
- messages dual linkage (chat_id + room_id)
