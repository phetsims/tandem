// Copyright 2021-2023, University of Colorado Boulder

/**
 * Unit tests for IOType
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import IOType from './IOType.js';
import BooleanIO from './BooleanIO.js';
import NumberIO from './NumberIO.js';
import StringIO from './StringIO.js';

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

    private _valueForGetterAndSetter = 'hi';

    public get gettersAndSettersTest() { return this._valueForGetterAndSetter; }

    public set gettersAndSettersTest( value: string ) { this._valueForGetterAndSetter = value; }

    public static MyClassIO = new IOType( 'MyClassIO', {
      valueType: MyClass,
      stateSchema: {
        firstField: BooleanIO,
        secondField: NumberIO,
        _willBePrivateInStateObject: NumberIO,
        myUnsettableField: StringIO,
        gettersAndSettersTest: StringIO
      }
    } );
  }

  const x = new MyClass();
  const stateObject = MyClass.MyClassIO.toStateObject( x );
  assert.ok( stateObject.firstField === true, 'stateObject firstField' );
  assert.ok( stateObject.secondField === 5, 'stateObject secondField' );
  assert.ok( stateObject._willBePrivateInStateObject === 42, 'stateObject willBePrivateInStateObject' );
  assert.ok( stateObject.myUnsettableField === 'unacceptable!', 'stateObject myUnsettableField' );
  assert.ok( stateObject.gettersAndSettersTest === 'hi', 'stateObject gettersAndSettersTest' );

  const myStateObject = {
    firstField: false,
    secondField: 2,
    _willBePrivateInStateObject: 100,
    myUnsettableField: 'other',
    gettersAndSettersTest: 'other2'
  };

  MyClass.MyClassIO.applyState( x, myStateObject );
  assert.equal( x.firstField, false, 'applyState firstField' );
  assert.ok( x.secondField === 2, 'applyState secondField' );
  assert.ok( x.willBePrivateInStateObject === 100, 'applyState willBePrivateInStateObject' );
  assert.ok( x[ '_myUnsettableField' ] === 'other', 'applyState myUnsettableField' );
  assert.ok( x.gettersAndSettersTest === 'other2', 'applyState gettersAndSettersTest' );
} );
