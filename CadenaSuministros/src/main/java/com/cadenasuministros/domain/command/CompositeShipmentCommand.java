package com.cadenasuministros.domain.command;

import com.cadenasuministros.domain.model.Shipment;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

public class CompositeShipmentCommand implements ShipmentCommand {

    private final List<ShipmentCommand> commands = new ArrayList<>();

    public CompositeShipmentCommand add(ShipmentCommand cmd) {
        commands.add(cmd);
        return this;
    }

    public List<ShipmentCommand> getCommands() {
        return commands;
    }

    @Override
    public Shipment execute() {
        Shipment last = null;
        for (ShipmentCommand cmd : commands) {
            last = cmd.execute();
        }
        return last;
    }

    @Override
    public Optional<Shipment> undo() {
        Shipment last = null;
        for (int i = commands.size() - 1; i >= 0; i--) {
            Optional<Shipment> result = commands.get(i).undo();
            if (result.isPresent()) last = result.get();
        }
        return Optional.ofNullable(last);
    }

    @Override
    public String getDescription() {
        return "Composite[" + commands.stream()
                .map(ShipmentCommand::getDescription)
                .collect(Collectors.joining(", ")) + "]";
    }

    @Override
    public UUID getShipmentId() {
        return commands.isEmpty() ? null : commands.get(commands.size() - 1).getShipmentId();
    }
}
