import {
  AccessKeyedExpression,
  AccessMemberExpression,
  AccessScopeExpression,
  AccessThisExpression,
  AnyBindingExpression,
  ArrayBindingPattern,
  ArrayLiteralExpression,
  AssignExpression,
  AttrSyntax,
  BinaryExpression,
  BindingBehaviorExpression,
  BindingContext,
  BindingIdentifier,
  BindingType,
  CallFunctionExpression,
  CallMemberExpression,
  CallScopeExpression,
  ConditionalExpression,
  ExpressionKind,
  ForOfStatement,
  HtmlLiteralExpression,
  IBindingContext,
  ICommandBuildInfo,
  ICompiledRenderContext,
  IHydratableController,
  IInstruction,
  Interpolation,
  IObservable,
  IOverrideContext,
  IViewModel,
  IVisitor,
  LifecycleFlags,
  ObjectBindingPattern, ObjectLiteralExpression, PrimitiveLiteralExpression, renderer, Scope, TaggedTemplateExpression, TemplateExpression, UnaryExpression, ValueConverterExpression } from "@aurelia/runtime-html";
import { attributePattern, BindingBehavior, bindingCommand, BindingCommandInstance, camelCase, IAttrMapper, IIndexable, IObserverLocator, IServiceLocator } from "aurelia";
import {
  connectable as auConnectable,
  IConnectable,
  IConnectableBinding,
  ISubscriber,
  subscriberCollection,
  ISubscriberCollection,
  IsBindingBehavior,
  IsLeftHandSide,
  IsAssign,
  BindingBehaviorInstance,
  BindingInterceptor,
  IInterceptableBinding,
  bindingBehavior,
} from '@aurelia/runtime';
import { IRenderer } from '@aurelia/runtime-html';
import {  Observable, Subscription } from "rxjs";

@attributePattern({ pattern: 'PART.subscribe', symbols: '.' })
export class SubscribeAttrPattern {
  ['PART.subscribe'](rawName: string, rawValue: string, parts: readonly string[]): AttrSyntax {
    return new AttrSyntax(rawName, rawValue, parts[0], 'subscribe');
  }
}

@bindingCommand('subscribe')
export class SubscribeCommand implements BindingCommandInstance {
  public bindingType: BindingType = BindingType.IsProperty;

  build(info: ICommandBuildInfo): IInstruction {
    return new SubscribeCommandInstruction(StreamAstVisitor.rebase(info.expr), info.attr.target);
  }
}

class SubscribeCommandInstruction implements IInstruction {
  type = 'si';
  constructor(
    public from: AnyBindingExpression,
    public to: string,
  ) {}
}

@renderer('si')
export class SubscribeCommandInstructionRenderer implements IRenderer {
  instructionType: 'si' = 'si';
  static inject = [IAttrMapper, IObserverLocator];
  constructor(public mapper: IAttrMapper, public obsLocator: IObserverLocator) {}

  render(
    flags: LifecycleFlags,
    context: ICompiledRenderContext,
    controller: IHydratableController<IViewModel>,
    target: unknown,
    instruction: SubscribeCommandInstruction
  ): void {
    controller.addBinding(new SubscribeBinding(
      instruction.from as any,
      target,
      this.mapper.map(target as any, instruction.to) ?? camelCase(instruction.to),
      context.container,
      this.obsLocator,
    ));
  }
}

interface SubscribeBinding extends IConnectableBinding {}

class SubscribeBinding implements ISubscriber {
  public value: any;
  private s: Scope;
  private hs: Scope | null;
  constructor(
    public expr: StreamAccessScopeExpression,
    public target: any,
    public prop: string,
    public c: IServiceLocator,
    public readonly observerLocator: IObserverLocator,
  ) {}

  handleChange(newValue: unknown, previousValue: unknown, flags: LifecycleFlags): void {
    this.obs.version++;
    newValue = this.expr.evaluate(LifecycleFlags.isStrictBindingStrategy, this.s, this.hs, this.c, this);
    this.obs.clear();
    this.target[this.prop] = newValue;
  }

  $bind(f, s, hs) {
    this.s = s;
    this.hs = hs;
    this.value = this.expr.evaluate(LifecycleFlags.isStrictBindingStrategy, s, hs, this.c, this as any);
    this.target[this.prop] = this.value;
  }

  $unbind() {
    this.obs.clear();
  }
}
auConnectable()(SubscribeBinding);

const streamToObserverMap = new WeakMap<Observable<unknown>, StreamObserver<unknown>>();

interface StreamObserver<T = unknown> extends ISubscriberCollection {}

@subscriberCollection()
class StreamObserver<T = unknown> {
  static from<T>(o: Observable<T>) {
    let observer = streamToObserverMap.get(o);
    if (observer === void 0) {
      streamToObserverMap.set(o, observer = new StreamObserver(o));
    }
    return observer;
  }

  private v: T;
  private readonly s: Subscription;
  protected constructor(private o: Observable<T>) {
    this.s = o.subscribe(v => {
      oV = this.v;
      this.v = v;
      this.subs.notify(v, oV, 0);
      oV = void 0;
    });
  }

  destroy() {
    this.s.unsubscribe();
  }

  getValue() {
    return this.v;
  }

  setValue() {
    // for callbag, this could be different
    throw new Error('Stream is readonly');
  }
}
let oV: unknown;

export class StreamAstVisitor implements IVisitor<AnyBindingExpression> {

  static rebase(expr: AnyBindingExpression) {
    return expr.accept(new StreamAstVisitor());
  }

  private constructor() {}

  visitAccessKeyed(expr: AccessKeyedExpression): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitAccessMember(expr: AccessMemberExpression): AnyBindingExpression {
    const object = expr.object.accept(this) as IsLeftHandSide;
    if (expr.name.endsWith('$')) {
      return new StreamAccessMemberExpression(object, expr.name);
    }
    return new AccessMemberExpression(object, expr.name);
  }
  visitAccessScope(expr: AccessScopeExpression): AnyBindingExpression {
    if (expr.name.endsWith('$')) {
      return new StreamAccessScopeExpression(expr.name, expr.ancestor, false);
    }
    return expr;
  }
  visitAccessThis(expr: AccessThisExpression): AnyBindingExpression {
    return expr;
  }
  visitArrayBindingPattern(expr: ArrayBindingPattern): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitArrayLiteral(expr: ArrayLiteralExpression): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitAssign(expr: AssignExpression): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitBinary(expr: BinaryExpression): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitBindingBehavior(expr: BindingBehaviorExpression): AnyBindingExpression {
    const inner = expr.expression.accept(this) as IsBindingBehavior;
    const args = Array(expr.args.length);
    const ii = args.length;
    let i = 0;
    let hasStream = inner !== expr.expression;
    while (ii > i) {
      if ((args[i] = expr.args[i].accept(this)) !== expr.args[i]) {
        hasStream = true;
      }
      ++i;
    }
    if (hasStream) {
      return new BindingBehaviorExpression(inner, expr.name, args);
    }
    return expr;
  }
  visitBindingIdentifier(expr: BindingIdentifier): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitCallFunction(expr: CallFunctionExpression): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitCallMember(expr: CallMemberExpression): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitCallScope(expr: CallScopeExpression): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitConditional(expr: ConditionalExpression): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitForOfStatement(expr: ForOfStatement): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitHtmlLiteral(expr: HtmlLiteralExpression): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitInterpolation(expr: Interpolation): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitObjectBindingPattern(expr: ObjectBindingPattern): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitObjectLiteral(expr: ObjectLiteralExpression): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitPrimitiveLiteral(expr: PrimitiveLiteralExpression<string | number | boolean>): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitTaggedTemplate(expr: TaggedTemplateExpression): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitTemplate(expr: TemplateExpression): AnyBindingExpression {
    const exprs = expr.expressions;
    const results = [];
    const ii = exprs.length;
    let e: AnyBindingExpression;
    let i = 0;
    let hasStream = false;

    for (; ii > i; ++i) {
      e = exprs[i];
      if ((results[i] = e.accept(this)) !== e) {
        hasStream = true;
      }
    }
    console.log(hasStream)
    if (hasStream) {
      return new StreamTemplateExpression(expr.cooked, results);
    }
    return expr;
  }
  visitUnary(expr: UnaryExpression): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
  visitValueConverter(expr: ValueConverterExpression): AnyBindingExpression {
    throw new Error("Method not implemented.");
  }
}

export class StreamAccessScopeExpression {
  public get $kind(): ExpressionKind.AccessScope { return ExpressionKind.AccessScope; }
  public get hasBind(): false { return false; }
  public get hasUnbind(): false { return false; }

  public constructor(
    public readonly name: string,
    public readonly ancestor: number = 0,
    public readonly accessHostScope: boolean = false,
  ) {}

  // todo: refactor this
  public evaluate(f: LifecycleFlags, s: Scope, hs: Scope | null, _l: IServiceLocator, c: IConnectable | null): IBindingContext | IOverrideContext {
    const obj = BindingContext.get(s, this.name, this.ancestor, f, hs) as IBindingContext;
    const evaluatedValue = obj[this.name] as ReturnType<AccessScopeExpression['evaluate']>;
    let value = evaluatedValue;
    if (c !== null) {
      c.observeProperty(obj, this.name);
      if (evaluatedValue != null && 'subscribe' in evaluatedValue) {
        const observer = StreamObserver.from(evaluatedValue as Observable<unknown>);
        value = observer.getValue();
        observer.subscribe(c as SubscribeBinding);
        return value;
      }
    }
    return value == null ? '' as unknown as ReturnType<AccessScopeExpression['evaluate']> : value;
  }

  public assign(f: LifecycleFlags, s: Scope, hs: Scope | null, _l: IServiceLocator, val: unknown): unknown {
    throw new Error('Stream based expression is not assignable');
  }

  public accept<T>(visitor: IVisitor<T>): T {
    return visitor.visitAccessScope(this);
  }
}

export class StreamAccessMemberExpression implements AccessMemberExpression {
  get $kind(): ExpressionKind.AccessMember { return ExpressionKind.AccessMember; }
  get hasBind(): false { return false; }
  get hasUnbind(): false { return false; }

  constructor(
    public object: IsLeftHandSide,
    public name: string,
  ) {}

  // todo: refactor this
  evaluate(f: LifecycleFlags, s: Scope, hs: Scope, l: IServiceLocator, c: IConnectable): unknown {
    const instance = this.object.evaluate(f, s, hs, l, (f & LifecycleFlags.observeLeafPropertiesOnly) > 0 ? null : c) as IIndexable;
    if (f & LifecycleFlags.isStrictBindingStrategy) {
      if (instance == null) {
        return instance;
      }
      if (c !== null) {
        c.observeProperty(instance, this.name);
        const value: any = instance[this.name];
        if (value != null && 'subscribe' in value) {
          const observer = StreamObserver.from(value);
          observer.subscribe(c as SubscribeBinding);
          return observer.getValue()[this.name];
        }
      }
      return instance[this.name];
    }
    if (c !== null && instance instanceof Object) {
      c.observeProperty(instance, this.name);
      const value: any = instance[this.name];
      if (value != null && 'subscribe' in value) {
        const observer = StreamObserver.from(value);
        observer.subscribe(c as SubscribeBinding);
        return observer.getValue()?.[this.name];
      }
    }
    return instance ? instance[this.name] : '';
  }
  assign(f: LifecycleFlags, s: Scope, hs: Scope, l: IServiceLocator, val: unknown): unknown {
    throw new Error("Stream access is readonly.");
  }
  accept<T>(visitor: IVisitor<T>): T {
    return visitor.visitAccessMember(this);
  }
}

export class StreamTemplateExpression implements TemplateExpression {
  get $kind(): ExpressionKind.Template { return ExpressionKind.Template; }
  get hasBind(): false { return false; }
  get hasUnbind(): false { return false; }

  constructor(
    public cooked: readonly string[],
    public expressions: readonly IsAssign[],
  ) {}

  evaluate(f: LifecycleFlags, s: Scope, hs: Scope, l: IServiceLocator, c: IConnectable): string {
    let result = this.cooked[0];
    let i = 0;
    for (; i < this.expressions.length; ++i) {
      result += String(this.expressions[i].evaluate(f, s, hs, l, c));
      result += this.cooked[i + 1];
    }
    return result;
  }

  assign(_f: LifecycleFlags, _s: Scope, _hs: Scope, _l: IServiceLocator, _obj: unknown): unknown {
    throw new Error("Method not implemented.");
  }

  accept<T>(visitor: IVisitor<T>): T {
    return visitor.visitTemplate(this);
  }
}
