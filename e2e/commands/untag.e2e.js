import { expect } from 'chai';
import Helper from '../e2e-helper';

describe('bit untag command', function () {
  this.timeout(0);
  const helper = new Helper();
  after(() => {
    helper.destroyEnv();
  });
  describe('unTag single component', () => {
    let localScope;
    before(() => {
      helper.reInitLocalScope();
      helper.createComponentBarFoo();
      helper.addComponentBarFoo();
      helper.commitComponentBarFoo();
      localScope = helper.cloneLocalScope();
      const output = helper.listLocalScope();
      expect(output).to.have.string('found 1 components');
    });
    describe('with one version', () => {
      before(() => {
        helper.runCmd('bit untag bar/foo 0.0.1');
      });
      it('should delete the entire component from the model', () => {
        const output = helper.listLocalScope();
        expect(output).to.have.string('found 0 components');
      });
    });
    describe('with multiple versions when specifying the version', () => {
      before(() => {
        helper.getClonedLocalScope(localScope);
        helper.commitComponent('bar/foo', undefined, '-f');
        const catComponent = helper.catComponent('bar/foo');
        expect(catComponent.versions).to.have.property('0.0.2');

        helper.runCmd('bit untag bar/foo 0.0.2');
      });
      it('should delete only the specified tag', () => {
        const catComponent = helper.catComponent('bar/foo');
        expect(catComponent.versions).to.not.have.property('0.0.2');
        expect(catComponent.versions).to.have.property('0.0.1');
      });
      it('should delete the specified version from the "state" attribute', () => {
        const catComponent = helper.catComponent('bar/foo');
        expect(catComponent.state.versions).to.not.have.property('0.0.2');
        expect(catComponent.state.versions).to.have.property('0.0.1');
      });
      it('bit show should work', () => {
        const showOutput = helper.showComponentParsed('bar/foo');
        expect(showOutput.name).to.equal('foo');
      });
      it('bit status should show the component as staged', () => {
        const output = helper.runCmd('bit status');
        expect(output).to.have.a.string('no new components');
        expect(output).to.have.a.string('no modified components');
        expect(output).to.not.have.a.string('no staged components');
        expect(output).to.have.a.string('staged components');
      });
    });
    describe('with multiple versions when not specifying the version', () => {
      describe('and all versions are local', () => {
        before(() => {
          helper.getClonedLocalScope(localScope);
          helper.commitComponent('bar/foo', undefined, '-f');
          const catComponent = helper.catComponent('bar/foo');
          expect(catComponent.versions).to.have.property('0.0.2');

          helper.runCmd('bit untag bar/foo');
        });
        it('should delete the entire component from the model', () => {
          const output = helper.listLocalScope();
          expect(output).to.have.string('found 0 components');
        });
      });
    });
    describe('when some versions are exported, some are local', () => {
      before(() => {
        helper.getClonedLocalScope(localScope);
        helper.reInitRemoteScope();
        helper.addRemoteScope();
        helper.exportAllComponents();
        helper.commitComponent('bar/foo', undefined, '-f');
        const catComponent = helper.catComponent('bar/foo');
        expect(catComponent.versions).to.have.property('0.0.2');
      });
      describe('un-tagging an exported version', () => {
        let output;
        before(() => {
          try {
            output = helper.runCmd('bit untag bar/foo 0.0.1');
          } catch (err) {
            output = err.message;
          }
        });
        it('should throw an error', () => {
          expect(output).to.have.string('unable to un-tag bar/foo, the version 0.0.1 was exported already');
        });
      });
      describe('un-tagging without version', () => {
        before(() => {
          helper.runCmd('bit untag bar/foo');
        });
        it('should delete only the local tag and leave the exported tag', () => {
          const catComponent = helper.catComponent('bar/foo');
          expect(catComponent.versions).to.not.have.property('0.0.2');
          expect(catComponent.versions).to.have.property('0.0.1');
        });
      });
    });
  });
  describe('unTag multiple components (--all flag)', () => {
    let localScope;
    before(() => {
      helper.setNewLocalAndRemoteScopes();
      helper.createComponentBarFoo();
      helper.addComponentBarFoo();
      helper.createComponent('bar', 'foo2.js');
      helper.addComponent('bar/foo2.js');
      helper.createComponent('bar', 'foo3.js');
      helper.addComponent('bar/foo3.js');
      helper.commitAllComponents();
      helper.exportComponent('bar/foo3');
      localScope = helper.cloneLocalScope();
      const output = helper.listLocalScope();
      expect(output).to.have.string('found 3 components');
    });
    describe('without specifying a version', () => {
      let untagOutput;
      before(() => {
        untagOutput = helper.runCmd('bit untag --all');
      });
      it('should display a descriptive successful message', () => {
        expect(untagOutput).to.have.string('2 component(s) were untagged');
      });
      it('should remove only local components from the model', () => {
        const output = helper.listLocalScope();
        expect(output).to.have.string('found 1 components');
        expect(output).to.have.string('bar/foo3');
      });
    });
    describe('with specifying a version', () => {
      let untagOutput;
      before(() => {
        helper.getClonedLocalScope(localScope);
        helper.runCmd('bit tag --scope 0.0.5');
        untagOutput = helper.runCmd('bit untag 0.0.5 --all');
      });
      it('should display a descriptive successful message', () => {
        expect(untagOutput).to.have.string('3 component(s) were untagged');
      });
      it('should remove only the specified version from the model', () => {
        const output = helper.listLocalScope();
        expect(output).to.have.string('found 3 components');
        expect(output).to.have.string('0.0.1');
        expect(output).to.not.have.string('0.0.5');
      });
    });
  });
});
