// Copyright 2020-2023, University of Colorado Boulder

/**
 * Unit tests for PhetioIDUtils
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

QUnit.module( 'PhetioIDUtils' );

QUnit.test( 'Test archetype mapping', assert => {

  const PhetioIDUtils = window.phetio.PhetioIDUtils;
  assert.equal(
    PhetioIDUtils.getArchetypalPhetioID(
      'circuitConstructionKitDc.introScreen.model.circuit.batteryGroup.battery_0.powerDissipatedProperty.dependencies.circuitConstructionKitDc-introScreen-model-circuit-batteryGroup-battery_0-currentProperty' ),
    'circuitConstructionKitDc.introScreen.model.circuit.batteryGroup.archetype.powerDissipatedProperty.dependencies.circuitConstructionKitDc-introScreen-model-circuit-batteryGroup-archetype-currentProperty',
    'Unexpected phetioID' );

  assert.equal(
    PhetioIDUtils.getArchetypalPhetioID(
      'circuitConstructionKitDc.introScreen.model.circuit.batteryGroup.battery_0' ),
    'circuitConstructionKitDc.introScreen.model.circuit.batteryGroup.archetype',
    'Unexpected phetioID' );

  assert.equal(
    PhetioIDUtils.getArchetypalPhetioID(
      'circuitConstructionKitDc.introScreen.model.circuit.batteryGroup' ),
    'circuitConstructionKitDc.introScreen.model.circuit.batteryGroup',
    'Unexpected phetioID' );

  assert.equal(
    PhetioIDUtils.getArchetypalPhetioID(
      'circuitConstructionKitDc-introScreen-model-circuit-batteryGroup-battery_0-currentProperty' ),
    'circuitConstructionKitDc-introScreen-model-circuit-batteryGroup-archetype-currentProperty',
    'Unexpected phetioID' );

  assert.equal(
    PhetioIDUtils.getArchetypalPhetioID(
      'sim.circuitConstructionKitDc-introScreen-model-circuit-batteryGroup-battery_0-currentProperty.test.battery_1' ),
    'sim.circuitConstructionKitDc-introScreen-model-circuit-batteryGroup-archetype-currentProperty.test.archetype',
    'Unexpected phetioID' );
} );
