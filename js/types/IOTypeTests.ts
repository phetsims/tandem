// Copyright 2021-2022, University of Colorado Boulder

/**
 * Unit tests for IOType
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import IOType from './IOType.js';
import BooleanIO from './BooleanIO.js';
import NumberIO from './NumberIO.js';

QUnit.module( 'IOType' );

QUnit.test( 'always true', assert => {
  assert.ok( true, 'initial test' );
} );
QUnit.test( 'default toStateObject and applyState', assert => {

  class MyClass {
    public firstField = true;
    public secondField = 5;
    public willBePrivateInStateObject = 42;
    private _myUnsettableField = 'unacceptable!';
    public get myUnsettableField() { return this._myUnsettableField; }

    public static MyClassIO = new IOType( 'MyClassIO', {
      valueType: MyClass,
      stateSchema: {
        firstField: BooleanIO,
        secondField: NumberIO,
        _willBePrivateInStateObject: NumberIO

        // TODO: this should work with https://github.com/phetsims/tandem/issues/297
        // myUnsettableField: StringIO
      }
    } );
  }

  const x = new MyClass();
  const stateObject = MyClass.MyClassIO.toStateObject( x );
  assert.ok( stateObject.firstField === true, 'stateObjet firstField' );
  assert.ok( stateObject.secondField === 5, 'stateObjet secondField' );
  assert.ok( stateObject._willBePrivateInStateObject === 42, 'stateObjet willBePrivateInStateObject' );

  // TODO: this should work with https://github.com/phetsims/tandem/issues/297
  // assert.ok( stateObject.myUnsettableField === 'unacceptable!', 'stateObjet myUnsettableField' );

  // TODO: defaultApplyStateTests, https://github.com/phetsims/tandem/issues/297
} );
