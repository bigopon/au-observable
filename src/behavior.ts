import { BindingInterceptor, IInterceptableBinding, BindingBehaviorExpression } from '@aurelia/runtime';
import { DebounceBindingBehavior, ThrottleBindingBehavior } from '@aurelia/runtime-html';
import { bindingBehavior, LifecycleFlags } from 'aurelia';
import { StreamAstVisitor } from './subscribe-command';

export class SubscribeBindingBehavior extends BindingInterceptor {
  public constructor(
    binding: IInterceptableBinding,
    expr: BindingBehaviorExpression,
  ) {
    super(binding, expr);
    binding['sourceExpression'] = StreamAstVisitor.rebase(expr);
  }

  $bind(f, s, hs) {
    this.binding.$bind(f | LifecycleFlags.isStrictBindingStrategy, s, hs);
  }
}
bindingBehavior('subscribe')(SubscribeBindingBehavior);