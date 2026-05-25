package com.cadenasuministros.domain.command;

import com.cadenasuministros.domain.model.Shipment;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

public class ShipmentCommandInvoker {

    private final Deque<ShipmentCommand> history = new ArrayDeque<>();
    private final Deque<ShipmentCommand> redoStack = new ArrayDeque<>();
    private static final int MAX_HISTORY = 50;

    public Shipment execute(ShipmentCommand command) {
        Shipment result = command.execute();
        history.push(command);
        redoStack.clear();
        if (history.size() > MAX_HISTORY) history.removeLast();
        return result;
    }

    public Optional<Shipment> undoLast() {
        if (history.isEmpty()) return Optional.empty();
        ShipmentCommand cmd = history.pop();
        Optional<Shipment> result = cmd.undo();
        redoStack.push(cmd);
        return result;
    }

    public Optional<Shipment> undoForShipment(UUID shipmentId) {
        ShipmentCommand found = null;
        for (ShipmentCommand cmd : history) {
            if (shipmentId.equals(cmd.getShipmentId())) {
                found = cmd;
                break;
            }
        }
        if (found == null) return Optional.empty();
        history.remove(found);
        Optional<Shipment> result = found.undo();
        redoStack.push(found);
        return result;
    }

    public Optional<Shipment> redo() {
        if (redoStack.isEmpty()) return Optional.empty();
        ShipmentCommand cmd = redoStack.pop();
        Optional<Shipment> result = Optional.of(cmd.execute());
        history.push(cmd);
        return result;
    }

    public List<String> getHistory() {
        return history.stream()
                .map(ShipmentCommand::getDescription)
                .collect(Collectors.toList());
    }

    public void clear() {
        history.clear();
        redoStack.clear();
    }
}
